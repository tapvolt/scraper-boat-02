import * as assert from "assert"
import * as cheerio from "cheerio"
import * as config from "config"
import * as fs from "fs"
import * as json2csv from "json2csv"
import * as req from "tinyreq"
import * as log from "winston"
import * as types from "./types"

export async function main() {

    [
        "scrape.domain",
        "scrape.url",
        "scrape.pagination",
        "scrape.min",
        "scrape.max",

        "selector.header",
        "selector.name",
        "selector.telephone",
        "selector.fax",
        "selector.website",
        "selector.description",

    ].forEach((key: string) => {
        assert(config.has(key), "Missing key in config")
    })

    const scrapeConfig = config.get<types.IScrapeConfig>("scrape"),
        selectorConfig = config.get<types.ISelectorConfig>("selector"),
        urls = [] as any,
        items = [] as any

    for (let i = scrapeConfig.min; i <= scrapeConfig.max; i = i + scrapeConfig.pagination) {
        const $ = await fetchPage(scrapeConfig.url + i),
            headerElements = $(selectorConfig.header)

        headerElements.each((index, element) => {
            const path = cheerio(element).children("h3").children("a").attr("href")
            urls.push(scrapeConfig.domain + path)
        })
    }

    for (const url of urls) {
        const $ = await fetchPage(url)
        items.push({
            name: $(selectorConfig.name).text(),
            website: $(selectorConfig.website).text(),
            telephone: $(selectorConfig.telephone).text(),
            fax: $(selectorConfig.fax).text(),
            description: $(selectorConfig.description).text(),
        })
    }

    const csv = json2csv({data: items})
    fs.writeFileSync("output.txt", csv)

    process.exit(0)
}

/**
 * @param url
 * @returns {Promise<>}
 */
function fetchPage(url: string): any {
    return new Promise((resolve) => {
        req(url, (err, body) => {
            if (err) {
                throw err
            }
            log.info(`fetching ${url}`)
            resolve(cheerio.load(body))
        })
    })
}

if (require.main === module) {
    main().catch((err) => {
        log.error("error encountered", err)
        process.exit(1)
    })
}
