DELETE FROM `bees`
WHERE ((status = 'stung') OR (status = 'eaten'))
LIMIT 10 OFFSET 5;
