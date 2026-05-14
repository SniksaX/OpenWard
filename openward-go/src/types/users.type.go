package types

type UserCred struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateUserCred struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type GetUserCred struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
