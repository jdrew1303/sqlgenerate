SELECT m.title, r.id AS [Theatre Number]
FROM `Movies` AS m
INNER JOIN (
  SELECT r2.movie_id
  FROM `Rooms` AS r2
  WHERE (r2.seats >= 50)
) AS r
ON ((m.id = r.movie_id) AND (m.title != 'Batman'));
