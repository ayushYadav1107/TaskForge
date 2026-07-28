-- TaskForge reference schema
-- The running app persists to data/db.json through server/db/jsonStore.js
-- (a zero-dependency embedded store), but the relational shape below is the
-- source of truth for the data model and doubles as documentation. Point
-- this file at MySQL/Postgres/SQLite verbatim if you ever want to swap the
-- storage layer for a real RDBMS.

CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('admin', 'manager', 'employee') NOT NULL DEFAULT 'employee',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) UNIQUE NOT NULL,
    description     VARCHAR(255)
);

CREATE TABLE employees (
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id   INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    employee_code   VARCHAR(20) UNIQUE NOT NULL,
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    position        VARCHAR(80),
    hire_date       DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    notes           TEXT,
    priority        ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    estimated_hours DECIMAL(6,2) CHECK (estimated_hours > 0),
    created_by      INTEGER NOT NULL REFERENCES users(id),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_assignments (
    id                      INTEGER PRIMARY KEY AUTO_INCREMENT,
    task_id                 INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id             INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status                  ENUM('Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled') NOT NULL DEFAULT 'Pending',
    completion_percentage   INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    remarks                 TEXT,
    assigned_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id         INTEGER REFERENCES users(id),
    action          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       INTEGER,
    before_state    JSON,
    after_state     JSON,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
