package findm

import (
	"context"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

type FindM struct {
	Logger  *zerolog.Logger
	Folders []string
}

type FindInfo struct {
	Id        int64  `json:"id"`
	Content   string `json:"content"`
	File      string `json:"file,omitempty"`
	Line      int    `json:"line,omitempty"`
	Folder    string `json:"folder,omitempty"`
	Timestamp string `json:"timestamp,omitempty"`
}

type SearchOptions struct {
	Query        string
	IgnoreCase   bool
	WordMatch    bool
	Literal      bool
	Limit        int
	Extensions   []string
	ExcludeDirs  []string
	ExcludeFiles []string
	MaxFileSize  int64
}

func New(folders []string) *FindM {
	return &FindM{
		Folders: uniqueNonEmpty(folders),
	}
}

func (f *FindM) SortByTimestamp(findInfos []FindInfo) {
	sort.Sort(ByTimestamp(findInfos))
}

type ByTimestamp []FindInfo

func (a ByTimestamp) Len() int      { return len(a) }
func (a ByTimestamp) Swap(i, j int) { a[i], a[j] = a[j], a[i] }
func (a ByTimestamp) Less(i, j int) bool {
	return a[i].Id > a[j].Id
}

func (f *FindM) Search(ctx context.Context, opt SearchOptions) ([]FindInfo, error) {
	if strings.TrimSpace(opt.Query) == "" {
		return nil, errors.New("query is required")
	}
	if len(f.Folders) == 0 {
		return nil, errors.New("no folders configured")
	}

	matcher, err := compileMatcher(opt)
	if err != nil {
		return nil, err
	}

	var results []FindInfo

	for _, root := range f.Folders {
		root := root

		err := filepath.WalkDir(root, func(path string, d fs.DirEntry, walkErr error) error {
			if walkErr != nil {
				if f.Logger != nil {
					f.Logger.Warn().Err(walkErr).Str("path", path).Msg("walk error")
				}
				return nil
			}

			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
			}

			if d.IsDir() {
				if shouldSkipDir(d.Name(), opt.ExcludeDirs) {
					return filepath.SkipDir
				}
				return nil
			}

			if shouldSkipFile(path, d.Name(), opt) {
				return nil
			}

			info, err := d.Info()
			if err != nil {
				return nil
			}
			if opt.MaxFileSize > 0 && info.Size() > opt.MaxFileSize {
				return nil
			}

			matches, err := searchFile(path, root, matcher)
			if err != nil {
				if f.Logger != nil {
					f.Logger.Debug().Err(err).Str("file", path).Msg("file search skipped")
				}
				return nil
			}

			results = append(results, matches...)
			if opt.Limit > 0 && len(results) >= opt.Limit {
				results = results[:opt.Limit]
				return context.Canceled
			}

			return nil
		})

		if err != nil && !errors.Is(err, context.Canceled) && !errors.Is(err, ctx.Err()) {
			return nil, err
		}
		if opt.Limit > 0 && len(results) >= opt.Limit {
			break
		}
	}

	f.SortByTimestamp(results)
	return results, nil
}

func compileMatcher(opt SearchOptions) (*regexp.Regexp, error) {
	pattern := opt.Query

	if opt.Literal {
		pattern = regexp.QuoteMeta(pattern)
	}
	if opt.WordMatch {
		pattern = `\b` + pattern + `\b`
	}
	if opt.IgnoreCase {
		pattern = `(?i)` + pattern
	}

	return regexp.Compile(pattern)
}

func searchFile(path, root string, re *regexp.Regexp) ([]FindInfo, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	if isBinary(data) {
		return nil, nil
	}

	lines := strings.Split(string(data), "\n")
	results := make([]FindInfo, 0)

	for i, line := range lines {
		if re.MatchString(line) {
			now := time.Now()
			results = append(results, FindInfo{
				Id:        now.UnixMilli() + int64(i),
				Content:   strings.TrimSpace(line),
				File:      path,
				Line:      i + 1,
				Folder:    root,
				Timestamp: now.Format(time.RFC3339),
			})
		}
	}

	return results, nil
}

func shouldSkipDir(name string, exclude []string) bool {
	for _, v := range exclude {
		if name == v {
			return true
		}
	}
	return false
}

func shouldSkipFile(path, name string, opt SearchOptions) bool {
	for _, v := range opt.ExcludeFiles {
		if name == v {
			return true
		}
	}

	if len(opt.Extensions) == 0 {
		return false
	}

	ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(path)), ".")
	for _, allowed := range opt.Extensions {
		if ext == strings.ToLower(strings.TrimPrefix(allowed, ".")) {
			return false
		}
	}
	return true
}

func isBinary(data []byte) bool {
	if len(data) == 0 {
		return false
	}

	n := len(data)
	if n > 8000 {
		n = 8000
	}

	for i := 0; i < n; i++ {
		if data[i] == 0 {
			return true
		}
	}
	return false
}

func uniqueNonEmpty(in []string) []string {
	seen := make(map[string]struct{}, len(in))
	out := make([]string, 0, len(in))

	for _, s := range in {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		s = filepath.Clean(s)
		if _, ok := seen[s]; ok {
			continue
		}
		seen[s] = struct{}{}
		out = append(out, s)
	}
	return out
}
