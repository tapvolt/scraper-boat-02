export interface IScrapeConfig {
    start: string
    url: string
    session: string
    pagination: number
    min: number
    max: number
}

export interface ISelectorConfig {
    even: string
    odd: string
}
