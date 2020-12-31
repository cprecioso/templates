import chalk from "chalk"

export const transformedInput = (
  name: string,
  resolver: (initial: string, value: string) => string,
  initial: string
) => ({
  name,
  type: "input" as const,
  transformer: (value: string) => {
    const resolved = resolver(initial, value)
    if (resolved === value) return value
    else return chalk`{dim (${resolved})} ${value}`
  },
  filter: (value: string) => resolver(initial, value),
})
