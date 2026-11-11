CREATE TABLE user_skills (
  _id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  skill text NOT NULL,
  skill_key text NOT NULL,
  created_at timestamp NOT NULL,
  UNIQUE (user_id, skill_key)
);

CREATE TABLE saved_listings (
  _id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  listing_id text NOT NULL,
  saved_at timestamp NOT NULL,
  UNIQUE (user_id, listing_id)
);
