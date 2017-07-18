import * as assert from "assert"
import * as cheerio from "cheerio"
import * as config from "config"
import * as fs from "fs"
import * as json2csv from "json2csv"
import * as req from "tinyreq"
import * as log from "winston"
import {ICssSelector, ITarget} from "./types"

export async function main() {

    [
        "target.domain",
        "target.uri",
        "target.pagination",
        "target.min",
        "target.max",

        "cssSelector.businessRecord",
        "cssSelector.name",
        "cssSelector.telephone",
        "cssSelector.fax",
        "cssSelector.website",
        "cssSelector.description",

    ].forEach((key: string) => {
        assert(config.has(key), "Missing key in config")
    })

    const target = config.get<ITarget>("target"),
        cssSelector = config.get<ICssSelector>("cssSelector"),
        urlsToVisit = [] as any,
        businesses = [] as any

    for (let i = target.min; i <= target.max; i = i + target.pagination) {
        const elements = await getElements(target, i, cssSelector)
        elements.each((index, el) => {
            const uri = cheerio(el).children("h3").children("a").attr("href")
            urlsToVisit.push(target.domain + uri)
        })
    }

    for (const url of urlsToVisit) {
        const $ = await fetch(url)
        businesses.push({
            name: $(cssSelector.name).text(),
            website: $(cssSelector.website).text(),
            telephone: $(cssSelector.telephone).text(),
            fax: $(cssSelector.fax).text(),
            description: $(cssSelector.description).text(),
        })
    }

    const csvData = json2csv({data: businesses})
    fs.writeFileSync("output.txt", csvData)

    process.exit(0)
}

/**
 * @param url
 * @returns {Promise<any>}
 */
async function fetch(url: string): Promise<any> {
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

/**
 * @param target
 * @param i
 * @param cssSelector
 * @returns {Promise<any>}
 */
async function getElements(target: ITarget, i: number, cssSelector: ICssSelector) {
    const $ = await fetch(target.domain + target.uri + i)
    return $(cssSelector.businessRecord)
}

if (require.main === module) {
    main().catch((err) => {
        log.error("error encountered", err)
        process.exit(1)
    })
}
