package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"crabcalendar/internal/models"
	"github.com/go-chi/chi/v5"
)

type TaskHandler struct {
	DB *sql.DB
}

func (h *TaskHandler) GetTasks(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT id, title, description, priority, due_date, status, created_at FROM tasks")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		var dueDateStr, createdAtStr string
		err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Priority, &dueDateStr, &t.Status, &createdAtStr)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		t.DueDate, _ = time.Parse(time.RFC3339, dueDateStr)
		t.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
		tasks = append(tasks, t)
	}

	json.NewEncoder(w).Encode(tasks)
}

func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	var t models.Task
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := h.DB.Exec("INSERT INTO tasks (title, description, priority, due_date, status) VALUES (?, ?, ?, ?, ?)",
		t.Title, t.Description, t.Priority, t.DueDate.Format(time.RFC3339), "Pending")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	t.ID, _ = res.LastInsertId()
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(t)
}

func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var t models.Task
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := h.DB.Exec("UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, status = ? WHERE id = ?",
		t.Title, t.Description, t.Priority, t.DueDate.Format(time.RFC3339), t.Status, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.DB.Exec("DELETE FROM tasks WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *TaskHandler) BulkCreate(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Tasks []models.Task `json:"tasks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	stmt, err := tx.Prepare("INSERT INTO tasks (title, description, priority, due_date, status) VALUES (?, ?, ?, ?, ?)")
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	for _, t := range payload.Tasks {
		_, err := stmt.Exec(t.Title, t.Description, t.Priority, t.DueDate.Format(time.RFC3339), "Pending")
		if err != nil {
			tx.Rollback()
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *TaskHandler) AgentContext(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT title, description, priority, due_date, status FROM tasks WHERE status = 'Pending' ORDER BY priority DESC, due_date ASC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var summary string
	summary += "# Current Active Tasks for Crab Calendar\n\n"
	summary += "The following tasks are currently pending, sorted by priority (Highest first) and then by due date.\n\n"

	found := false
	for rows.Next() {
		found = true
		var title, desc, status, dueDateStr string
		var priority int
		rows.Scan(&title, &desc, &priority, &dueDateStr, &status)

		dueDate, _ := time.Parse(time.RFC3339, dueDateStr)
		
		summary += fmt.Sprintf("### %s\n", title)
		summary += fmt.Sprintf("- **Priority:** %d (1=Low, 3=High)\n", priority)
		summary += fmt.Sprintf("- **Due Date:** %s\n", dueDate.Format("2006-01-02 15:04"))
		summary += fmt.Sprintf("- **Status:** %s\n", status)
		if desc != "" {
			summary += fmt.Sprintf("- **Description:** %s\n", desc)
		}
		summary += "\n"
	}

	if !found {
		summary += "No active tasks found. Enjoy your day!\n"
	}

	w.Header().Set("Content-Type", "text/markdown")
	fmt.Fprint(w, summary)
}
