export interface IScrapeConfig {
    domain: string
    url: string
    pagination: number
    min: number
    max: number
}

export interface ISelectorConfig {
    header: string
    name: string
    telephone: string
    fax: string
    website: string
    description: string
}
