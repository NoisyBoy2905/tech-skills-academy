CREATE TABLE applications (
 user_id TEXT NOT NULL,
 id TEXT NOT NULL,
 title TEXT NOT NULL,
 employer TEXT NOT NULL,
 url TEXT,
 status TEXT NOT NULL CHECK (status IN ('applied', 'assessment', 'complete')),
 updated_at TEXT NOT NULL,
 PRIMARY KEY (user_id, id)
);
