package migrations

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"sort"
	"strings"
)

type Migration struct {
	Version string
	UpSQL   string
	DownSQL string
}

func RunMigrations(db *sql.DB, migrationsDir string) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(14) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	migrations, err := loadMigrations(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to load migrations: %w", err)
	}

	applied := make(map[string]bool)
	rows, err := db.Query("SELECT version FROM schema_migrations")
	if err != nil {
		return fmt.Errorf("failed to query applied migrations: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var version string
		rows.Scan(&version)
		applied[version] = true
	}

	for _, migration := range migrations {
		if applied[migration.Version] {
			log.Printf("Migration %s already applied, skipping", migration.Version)
			continue
		}

		log.Printf("Applying migration %s...", migration.Version)

		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("failed to begin transaction: %w", err)
		}

		_, err = tx.Exec(migration.UpSQL)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to execute migration %s: %w", migration.Version, err)
		}

		_, err = tx.Exec("INSERT INTO schema_migrations (version) VALUES ($1)", migration.Version)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration %s: %w", migration.Version, err)
		}

		if err = tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit migration %s: %w", migration.Version, err)
		}

		log.Printf("Migration %s applied successfully", migration.Version)
	}

	return nil
}

func RollbackMigrations(db *sql.DB, migrationsDir string, steps int) error {
	migrations, err := loadMigrations(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to load migrations: %w", err)
	}

	rows, err := db.Query(`
		SELECT version FROM schema_migrations 
		ORDER BY applied_at DESC LIMIT $1
	`, steps)
	if err != nil {
		return fmt.Errorf("failed to query applied migrations: %w", err)
	}
	defer rows.Close()

	var toRollback []string
	for rows.Next() {
		var version string
		rows.Scan(&version)
		toRollback = append(toRollback, version)
	}

	for _, version := range toRollback {
		log.Printf("Rolling back migration %s...", version)

		var migration *Migration
		for _, m := range migrations {
			if m.Version == version {
				migration = m
				break
			}
		}

		if migration == nil {
			return fmt.Errorf("migration %s not found", version)
		}

		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("failed to begin transaction: %w", err)
		}

		_, err = tx.Exec(migration.DownSQL)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to rollback migration %s: %w", version, err)
		}

		_, err = tx.Exec("DELETE FROM schema_migrations WHERE version = $1", version)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to delete migration record: %w", err)
		}

		if err = tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit rollback: %w", err)
		}

		log.Printf("Migration %s rolled back successfully", version)
	}

	return nil
}

func loadMigrations(migrationsDir string) ([]*Migration, error) {
	upFiles, err := filepath.Glob(filepath.Join(migrationsDir, "up", "*.sql"))
	if err != nil {
		return nil, err
	}

	var migrations []*Migration
	for _, upFile := range upFiles {
		base := filepath.Base(upFile)
		version := strings.Split(base, "_")[0]

		upSQL, err := ioutil.ReadFile(upFile)
		if err != nil {
			return nil, fmt.Errorf("failed to read %s: %w", upFile, err)
		}

		downFile := filepath.Join(migrationsDir, "down", base)
		downSQL, err := ioutil.ReadFile(downFile)
		if err != nil {
			return nil, fmt.Errorf("failed to read down migration %s: %w", downFile, err)
		}

		migrations = append(migrations, &Migration{
			Version: version,
			UpSQL:   string(upSQL),
			DownSQL: string(downSQL),
		})
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})

	return migrations, nil
}
