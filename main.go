package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"

	"crabcalendar/internal/db"
	"crabcalendar/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/webview/webview_go"
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

	// 4. Start Server on a random port
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	port := ln.Addr().(*net.TCPAddr).Port
	srv := &http.Server{Handler: r}

	go func() {
		if err := srv.Serve(ln); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	// 5. Setup Webview
	debug := true
	if os.Getenv("APP_ENV") == "production" {
		debug = false
	}
	
	w := webview.New(debug)
	defer w.Destroy()
	w.SetTitle("Crab Calendar")
	w.SetSize(1000, 800, webview.HintNone)
	w.Navigate(fmt.Sprintf("http://127.0.0.1:%d", port))
	w.Run()
}
