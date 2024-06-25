# Blue Points Subgraph

## Overview

The Blue Points Subgraph serves as a dedicated indexing tool to track users proportions of Morpho Blue's Markets & MetaMorpho vaults.
A `Point` is a unit of measure representing a user's participation in a user pool. Users accrue X amount of points per pool share per second.

## Market Points

Market Points: one market share for 1 second, per market side.
For example, if I have 10 supply shares in marketA during 10 seconds, I will have 100 marketA supply shares in total.

The precision of one point is the precision of one morpho share, i.e. underlying token decimals + 6 decimals
for collateral, this is directly the same precision as the underlying token.

## MetaMorpho Points

The concept of a Point for a MetaMorpho vault is exactly the same as for a market Point.
One MetaMorpho Point = One MetaMorpho share for 1 second.

## How to format points

In order to have "human readable" points, we add 6 decimals of precision to the number of points.
For a given market, the points accrued inherits on the shares precision, and on the collateral asset precision for collateral points.

As a reminder, the precision of the market shares for the borrow & the supply side is the underlying token decimals + 6 decimals.

So the global precision of a supply point is the underlying token decimals + 12 decimals.

# Snapshots

When a user interacts with Blue or MetaMorpho vaults, user points will be updated but we also save the user's points at the time of the interaction in a snapshot.
That way the evolution of user points can be tracked over time.
