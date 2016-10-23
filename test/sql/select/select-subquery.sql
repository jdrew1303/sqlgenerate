SELECT a.color
FROM (
  SELECT b.color
  FROM `bananas` b
) AS z JOIN `apples` a
ON (a.color = b.color)
