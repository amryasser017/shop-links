-- Run this once on your MySQL server.
-- On a hosted database the database already exists: skip the first two lines and run the rest inside it.
CREATE DATABASE IF NOT EXISTS store_links CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE store_links;

CREATE TABLE IF NOT EXISTS admin (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(16),
    description TEXT
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS stores (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    logo_url VARCHAR(500),
    phone VARCHAR(255),
    address VARCHAR(255),
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(ID) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
