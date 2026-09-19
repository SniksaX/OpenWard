package middlewares

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"sync"
	"time"

	"openward/src/utils"
)

type streamEntry struct {
	expires time.Time
}

type StreamTokenStore struct {
	mu     sync.Mutex
	tokens map[string]streamEntry
}

func NewStreamTokenStore() *StreamTokenStore {
	return &StreamTokenStore{tokens: make(map[string]streamEntry)}
}

func (s *StreamTokenStore) Issue() (string, error) {
	return s.issue(60 * time.Second)
}

func (s *StreamTokenStore) issue(ttl time.Duration) (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	token := hex.EncodeToString(raw)

	s.mu.Lock()
	defer s.mu.Unlock()
	s.evictLocked()
	s.tokens[token] = streamEntry{expires: time.Now().Add(ttl)}
	return token, nil
}

func (s *StreamTokenStore) Consume(token string) bool {
	if token == "" {
		return false
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.evictLocked()
	entry, ok := s.tokens[token]
	if !ok {
		return false
	}
	delete(s.tokens, token)
	return time.Now().Before(entry.expires)
}

func (s *StreamTokenStore) evictLocked() {
	now := time.Now()
	for k, entry := range s.tokens {
		if !now.Before(entry.expires) {
			delete(s.tokens, k)
		}
	}
}

func IssueStreamToken(store *StreamTokenStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token, err := store.Issue()
		if err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "failed to issue stream token")
			return
		}
		utils.WriteJson(w, http.StatusCreated, map[string]string{"token": token})
	}
}

func RequireStreamToken(store *StreamTokenStore, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !store.Consume(r.URL.Query().Get("token")) {
			utils.WriteError(w, http.StatusUnauthorized, "Authentication required")
			return
		}
		next.ServeHTTP(w, r)
	}
}
