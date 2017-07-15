import * as assert from "assert"
import * as cheerio from "cheerio"
import * as config from "config"
import * as fs from "fs"
import * as req from "tinyreq"
import * as log from "winston"
import * as types from "./types"

export async function main() {

    [
        "scrape.start",
        "scrape.url",
        "scrape.pagination",
        "scrape.session",
        "scrape.min",
        "scrape.max",

        "selector.even",
        "selector.odd",

    ].forEach((key: string) => {
        assert(config.has(key), "Missing key in config")
    })

    const scrapeConfig = config.get<types.IScrapeConfig>("scrape"),
        selectorConfig = config.get<types.ISelectorConfig>("selector"),
        items = [] as any

    for (let i = scrapeConfig.min; i <= scrapeConfig.max; i = i + scrapeConfig.pagination) {
        const $ = await fetchPage(scrapeConfig.url + i, scrapeConfig.session)
        iterator([$(selectorConfig.even), $(selectorConfig.odd)], items)
    }

    items.shift()
    const tabDelimited = items.join("\t")
    fs.writeFileSync("output.txt", tabDelimited)

    process.exit(0)
}

/**
 * @param selectors
 * @param items
 */
function iterator(selectors, items) {
    selectors.forEach((selector) => {
        selector.map((index, element) => {
            if (isCountryHeader(element)) {
                return
            }

            const text = cheerio(element).text().trim()
            if (text === "") {
                return
            }

            if (isBusinessHeader(element)) {
                log.info(`new business detected - ${text}`)
                items.push("\n")
            }

            if (text.indexOf("|") !== -1) {
                text.split("|").forEach((part) => {
                    if (part) {
                        items.push(part.trim())
                    }
                })
                return
            }
            items.push(text)
        })
    })
}

/**
 * @param url
 * @param session
 * @returns {Promise<>}
 */
function fetchPage(url: string, session: string): any {
    return new Promise((resolve) => {
        const options = {
            headers: {
                Cookie: "SESSID=" + session,
            },
            url,
        }
        req(options, (err, body) => {
            if (err) {
                throw err
            }
            log.info(`fetching ${url}`)
            resolve(cheerio.load(body))
        })
    })
}

/**
 * @param element
 * @returns {boolean}
 */
function isCountryHeader(element) {
    return cheerio(element).children().children(".ss_country").length === 1
}

/**
 * @param element
 * @returns {boolean}
 */
function isBusinessHeader(element) {
    return cheerio(element).children().children(".ss_cname").length === 1
}

if (require.main === module) {
    main().catch((err) => {
        log.error("error encountered", err)
        process.exit(1)
    })
}
