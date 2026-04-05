package utils

import (
	"crypto/sha1"
	"fmt"
)

func Hash(input string) string {
	h := sha1.New()
	h.Write([]byte(input))
	return fmt.Sprintf("%x", h.Sum(nil))
}
