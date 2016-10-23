SELECT a.color
FROM (
  SELECT b.color
  FROM `bananas` AS b
) AS z JOIN `apples` AS a
ON (a.color = b.color)
