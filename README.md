# OpenFlag

openflag is simple idea

we all just click "i agree" without reading anything  
privacy policy is long, boring and confusing  
no one actually read that

so i made this

## what it does

you search any software

it will show

- quick summary
- what data they collect
- where your data goes
- red flags / green flags
- important things you should know

so you dont need to read 50 pages legal text

## how it works

1. take privacy policy + terms
2. clean and process text
3. run ai in steps
4. generate structured output
5. show in simple ui

everything is not realtime  
data is processed before and reviewed

## features (current [TODO])

- software search
- simple clean UI
- structured policy breakdown
- flags (red, yellow, green)
- verdict (safe / caution / risk)

## coming next

- compare softwares
- open source alternatives
- opt-out email generator
- ai chat for policy questions

## why i made this

i dont like reading privacy policy  
but also dont like being blind

so this is middle solution

## note

this is not legal advice  
just help you understand things better

## tech

- next.js (frontend)
- python worker (pipeline)
- postgres
- qdrant (vector db)
- openrouter (llm)

## status

work in progress but usable
