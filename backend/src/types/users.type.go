package types

type UserCred struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type CreateUserCred struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type GetUserCred struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ClaimRequest struct {
	PeerID   int    `json:"peer_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}
