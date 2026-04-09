import { defineHandler } from "nitro"

export default defineHandler((event) => {
    const { id } = event.context.params
})
