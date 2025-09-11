-- Migration: Add missing columns to users table for FSBO registration
ALTER TABLE users
  ADD COLUMN first_name VARCHAR(100),
  ADD COLUMN last_name VARCHAR(100),
  ADD COLUMN phone VARCHAR(30),
  ADD COLUMN plan VARCHAR(50),
  ADD COLUMN user_type VARCHAR(30);
