package models

import "time"

type Task struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Priority    int       `json:"priority"` // 1-3
	DueDate     time.Time `json:"due_date"`
	Status      string    `json:"status"` // "Pending", "Done"
	CreatedAt   time.Time `json:"created_at"`
}
