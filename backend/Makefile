.PHONY: help install dev build test fmt clean migrate

help:
	@echo "Financial Freedom Backend - Available Commands:"
	@echo "  make install    - Download dependencies"
	@echo "  make dev        - Run development server"
	@echo "  make build      - Build for production"
	@echo "  make test       - Run tests"
	@echo "  make fmt        - Format code"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make migrate    - Run database migrations"

install:
	go mod download
	go mod tidy

dev:
	go run cmd/main.go

build:
	go build -o bin/financial-freedom cmd/main.go

test:
	go test ./... -v

fmt:
	go fmt ./...

clean:
	rm -rf bin/
	go clean

migrate:
	@echo "Running migrations..."
	@echo "Please ensure your database is running and .env is configured correctly"
