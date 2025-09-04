CREATE DATABASE IF NOT EXISTS crypto_portfolio;
USE crypto_portfolio;

CREATE TABLE IF NOT EXISTS watchlists (
  auth0_sub VARCHAR(128) NOT NULL,
  cg_id     VARCHAR(64)  NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (auth0_sub, cg_id)
);