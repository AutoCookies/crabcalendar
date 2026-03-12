package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"

	"crabcalendar/internal/db"
	"crabcalendar/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

//go:embed static/* assets/*
var embeddedFiles embed.FS

func main() {
	// 1. Initialize DB
	database, err := db.InitDB("crab_tasks.db")
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	// 2. Setup Handlers
	h := &handlers.TaskHandler{DB: database}

	// 3. Setup Router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Route("/api", func(r chi.Router) {
		r.Get("/tasks", h.GetTasks)
		r.Post("/tasks", h.CreateTask)
		r.Post("/tasks/bulk", h.BulkCreate)
		r.Put("/tasks/{id}", h.UpdateTask)
		r.Delete("/tasks/{id}", h.DeleteTask)
		r.Get("/agent/context", h.AgentContext)
	})

	contentStatic, _ := fs.Sub(embeddedFiles, "static")
	r.Handle("/*", http.FileServer(http.FS(contentStatic)))

	contentAssets, _ := fs.Sub(embeddedFiles, "assets")
	r.Handle("/assets/*", http.StripPrefix("/assets/", http.FileServer(http.FS(contentAssets))))

	// 4. Start Server
	portStr := os.Getenv("PORT")
	if portStr == "" {
		portStr = "11440" // Default for crabcalendar
	}

	utils_log := log.New(os.Stdout, "[CrabCalendar] ", log.LstdFlags)
	utils_log.Printf("Starting server on port %s", portStr)

	if err := http.ListenAndServe("127.0.0.1:"+portStr, r); err != nil {
		log.Fatal(err)
	}
}
