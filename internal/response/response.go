package response

import "github.com/gin-gonic/gin"

type Envelope struct {
	Data   any    `json:"data"`
	Error  string `json:"error"`
	Status bool   `json:"status"`
}

func Success(c *gin.Context, status int, data any) {
	c.JSON(status, Envelope{Data: data, Status: true})
}

func Fail(c *gin.Context, status int, message string) {
	c.JSON(status, Envelope{Error: message, Status: false})
}
