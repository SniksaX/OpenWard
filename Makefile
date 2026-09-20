.PHONY: frontend dist backend test

# Next export → frontend/dist, then copy to ./dist for SERVE_DIR (default).
frontend:
	cd frontend && npm ci && npm run build

dist: frontend
	rm -rf dist
	cp -a frontend/dist dist

backend:
	cd backend && go build -o ../bin/openward ./src

test:
	cd backend && go test ./...
