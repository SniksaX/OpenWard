package middlewares

import (
	"context"
	"net/http"
	"strings"

	"openward/src/utils"
)

type ctxKey string

const (
	CtxUserID   ctxKey = "user_id"
	CtxUsername ctxKey = "username"
	CtxRole     ctxKey = "role"
)

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenString := ""

		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		if tokenString == "" {
			tokenString = r.URL.Query().Get("token")
		}

		if tokenString == "" {
			utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
			return
		}

		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			utils.WriteError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		ctx := context.WithValue(r.Context(), CtxUserID, claims["user_id"])
		ctx = context.WithValue(ctx, CtxUsername, claims["username"])
		ctx = context.WithValue(ctx, CtxRole, claims["role"])

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func RequireRole(role string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		got, ok := r.Context().Value(CtxRole).(string)
		if !ok || got != role {
			utils.WriteError(w, http.StatusForbidden, "Insufficient role")
			return
		}
		next.ServeHTTP(w, r)
	}
}
