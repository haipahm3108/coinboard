CREATE DATABASE IF NOT EXISTS crypto_portfolio
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crypto_portfolio;

CREATE TABLE IF NOT EXISTS watchlists (
  auth0_sub VARCHAR(128) NOT NULL,
  cg_id     VARCHAR(64)  NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (auth0_sub, cg_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
