SELECT m.title, r.id AS [Theatre Number]
FROM `Movies` AS m
LEFT OUTER JOIN `Rooms` AS r
ON (m.id = r.movie_id);
