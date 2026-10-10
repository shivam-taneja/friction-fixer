# Friction Fixer

An AI agent that fixes your website by itself.

It looks at how visitors behave, changes the page to fix what is driving them away, then checks if the change helped. If it did not help, the agent undoes the change and tries something else.

Built for [neatHack](https://neatlogs.com/hackathon) (Oct 10-12, 2026).

## The problem

Visitors land on a homepage, scroll a bit, and leave. Someone has to read the analytics, guess what is wrong, edit the page, and wait to see if it worked. This is slow and most small teams never do it.

## How it works

Full details are in [FLOW.md](FLOW.md). In short:

1. **Analyst agent** reads the visitor data and writes a plan: what is wrong and one change to try.
2. **Builder agent** reads the plan, edits the site, and opens a pull request (PR).
3. The PR is merged and the site goes live automatically.
4. **Reviewer agent** checks the live site and the new numbers, then decides: keep the change or undo it.
5. If undone, the reason goes back to the Analyst, who tries a different idea.

## Current status

The goal right now is a complete, working loop. Because real traffic takes too long to collect in a 48-hour hackathon, the agent is currently fed **mock visitor data**.

## Project structure

<!-- TODO -->

## Tools used

- **neatlogs:** records every agent run so failures can be found and fixed.
- **Entire:** saves the reasoning behind every code change as checkpoints.
- **cfo.ai:** used to plan pricing, costs and revenue for Friction Fixer as a product.

## Evidence

- neatlogs traces, before vs after improving the agent: _link_
- A run where the agent's change failed and it undid it: _link_
- Website results, before vs after (mock data): _numbers_
- Entire checkpoints: _link or screenshot_
- cfo.ai business plan: _link_
- Demo video: _link_
- Posts shared while building (#neatHack): _links_
