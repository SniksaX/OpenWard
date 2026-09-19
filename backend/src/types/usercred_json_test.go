package types

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestUserCredPasswordOmittedFromJSON(t *testing.T) {
	u := UserCred{
		ID:       1,
		Username: "root",
		Email:    "root@ow.net",
		Password: "$2a$10$bcrypt-hash-must-not-leak",
		Role:     "admin",
	}
	b, err := json.Marshal(u)
	if err != nil {
		t.Fatal(err)
	}
	out := string(b)
	if strings.Contains(out, "bcrypt-hash-must-not-leak") || strings.Contains(out, "password") {
		t.Fatalf("password leaked in JSON: %s", out)
	}

	in := CreateUserCred{Username: "x", Email: "x@y.z", Password: "inbound-ok", Role: "standard"}
	inJSON, err := json.Marshal(in)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(inJSON), `"password":"inbound-ok"`) {
		t.Fatalf("CreateUserCred must still encode password for inbound use: %s", inJSON)
	}
}
