package version

import "fmt"

var (
	Version   = "dev"
	Commit    = "none"
	BuildDate = "unknown"
)

func String() string {
	return fmt.Sprintf("version=%s commit=%s buildDate=%s", Version, Commit, BuildDate)
}
