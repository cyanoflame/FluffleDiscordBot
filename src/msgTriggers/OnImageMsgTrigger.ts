import type { MsgTrigger } from "./MsgTrigger.js"
import { Attachment, Client, Message, TextChannel } from "discord.js"
import type { Snowflake } from "discord.js"
import sharp from "sharp"
import { EventData } from "../models/eventData.js"
import { FormData } from "formdata-node"
import { FormDataEncoder } from "form-data-encoder"
import { Readable } from "stream"

/**
 * This function checks if the content type part of a header is an image.
 * @param contentTypeSpecifier String for the content type part of a header
 * @returns Whether or not the content type header specifies an image or not.
 */
function isImageContentType(contentTypeSpecifier: string | null): boolean {
    if(contentTypeSpecifier != null) {
        return contentTypeSpecifier.substring(0,5) == "image"
    }
    return false
}

/**
 * This is the typing for the JSON returned by Fluffle
 */
type FluffleResult = {
    id: string,
    stats: {
        count: number,
        elapsedMilliseconds: number
    },
    results: {
        id: number,
        score: number,
        match: 'exact' | 'alternative' | 'tossup' | 'unlikely',
        platform: string,
        location: string,
        isSfw: boolean,
        thumbnail: {
            width: number,
            height: number,
            centerX: number,
            centerY: number,
            location: string
        },
        credits: {
            id: number,
            name: string
        }[]
    }[]
}

/**
 * This parses the result and returns it in a readable form for Discord.
 * @param fluffleResult The result returend from fluffle.
 */
function parseResults(fluffleResult: FluffleResult): string {
    // The result string will be saved to here
    let exactSources: string[] = []
    let altSources: string[] = []
    let tossupSources: string[] = []

    // Parse through the fluffle result and return a string
    for(let i = 0; i < fluffleResult.results.length; i++) {
        switch(fluffleResult.results[i].match) {
            case 'exact':
                // Likely the exact image
                exactSources.push(`[${fluffleResult.results[i].platform}](${fluffleResult.results[i].location})`)
                break
            case 'alternative':
                // Likely an alt version of the exact image
                altSources.push(`[${fluffleResult.results[i].platform}](${fluffleResult.results[i].location})`)
                break
            case 'tossup':
                tossupSources.push(`[${fluffleResult.results[i].platform}](${fluffleResult.results[i].location})`)
                // Could be either the exact image or an alternative - not sure which one
                break
            case 'unlikely':
                // The chance of it being this are very unlikely
                // In this case, these will NOT be added/considered
                break
        }
    }

    // Convert the results to a string to return
    let resultString = ""

    // Combine all of the results
    if(exactSources.length + altSources.length + tossupSources.length > 0) {
        // Add the exact matches first
        if(exactSources.length > 0) {
            resultString += "> Exact Matches:\n"
            for(let i = 0; i < exactSources.length; i++) {
                resultString += `> - ${exactSources[i]}\n`
            }
        }

        // Add the alternate matches second
        if(altSources.length > 0) {
            resultString += "> Alternate Matches:\n"
            for(let i = 0; i < altSources.length; i++) {
                resultString += `> - ${altSources[i]}\n`
            }
        }

        // Add the tossup matches last
        if(tossupSources.length > 0) {
            resultString += "> Other Matches:\n"
            for(let i = 0; i < tossupSources.length; i++) {
                resultString += `> - ${tossupSources[i]}\n`
            }
        }
    } else {
        return resultString = "> Unable to find image :("
    }

    return resultString
}

/**
 * This is a trigger that occurs whenever an image is sent to a channel. It will auto search the 
 * image on Fluffle and responds to the message with any sources found.
 */
class OnImageMsgTrigger implements MsgTrigger {
    
    /** This event does not need the message guild to run */
    public readonly requireGuild: boolean = false

    /**
     * Creates a new MsgTrigger.
     */
    constructor() {
        // doesnt need anything
    }

    private count = 0

    /**
     * This will check if a message sent has an image with it to search. If it does, it will
     * return true. If not, the trigger will return false.
     * @param msg The message being checked for an image.
     * @returns Whether or not there is an image attached to the message to reverse image search.
     */
    public triggered(msg: Message): boolean {
        // console.log(`MESSAGE ${this.count++}:`, msg)
        console.log(`MESSAGE ${this.count++}:`)

        // if it's not in the right guild/channel, dont do anything
        if(msg.guildId == process.env.TEMP_GUILD_ID && msg.channelId == process.env.TEMP_CHANNEL_ID) {
            // Check all of the attachments for an image
            for(let i = 0; i < msg.attachments.size; i++) {
                if(isImageContentType(msg.attachments.at(i)!.contentType)) {
                    return true
                }
            }

            // Check the forwarded post elements
            if(msg.messageSnapshots.size > 0) {
                // Only need to track the latest. If the latest doesnt have one, then checking the others doesnt matter.
                // https://discord.com/developers/docs/reference#snowflakes
                let largestSnapshotSnowflake: Snowflake | undefined = undefined
                // Get the latest snowflake
                for(const snowflakeObj of msg.messageSnapshots.keys()) {
                    if(largestSnapshotSnowflake == undefined || largestSnapshotSnowflake.localeCompare(snowflakeObj) < 0) {
                        largestSnapshotSnowflake = snowflakeObj
                    }
                }

                // largestSnowflake will not be undefined here

                // Check the latest snapshot for having an image attachment
                for(const attachment of msg.messageSnapshots.get(largestSnapshotSnowflake!)!.attachments.values()) {
                    if(isImageContentType(attachment.contentType)) {
                        return true
                    }
                }
            }
        }

        return false
    }

    /**
     * When the trigger conditions are met, this function will be executed.
     * @param client The Discord client to run any commands to interact with Discord.
     * @param msg The message casuing the trigger.
     * @param data The data related to the event, passed in from the EventDataService.
     */
    public async execute(client: Client, msg: Message, data: EventData): Promise<void> {
        // Check the referenced post if it's a forwarded message

        // get the message channel to send the response to
        let channel = client.channels.cache.get(msg.channelId)

        if(channel == undefined) {
            throw Error("Unable to get message channel.")
        }

        // Ensure it can send it to the channel properly
        if(!channel.isTextBased()) {
            console.error("Channel is not a text based channel!")
            return
        }

        // Update the channel type to a text channel
        channel = channel as unknown as TextChannel

        // The string that will show when it's searching
        let searchingString = "> *Searching...*"

        // the string that everything is outpuyt to
        let outputString = ""

        // Initialize the sending of the results
        let responseMsg = await channel.send({
            content: searchingString,
            reply: {
                messageReference: msg.id
            },
            flags: "SuppressEmbeds"
        })

        let imageAttachments: Attachment[] = []

        // Check the forwarded post elements
        if(msg.messageSnapshots.size > 0) {
            // Only need to track the latest. If the latest doesnt have one, then checking the others doesnt matter.
            // https://discord.com/developers/docs/reference#snowflakes
            let largestSnapshotSnowflake: Snowflake | undefined = undefined
            // Get the latest snowflake
            for(const snowflakeObj of msg.messageSnapshots.keys()) {
                if(largestSnapshotSnowflake == undefined || largestSnapshotSnowflake.localeCompare(snowflakeObj) < 0) {
                    largestSnapshotSnowflake = snowflakeObj
                }
            }

            // Add the image attachments
            for(const attachment of msg.messageSnapshots.get(largestSnapshotSnowflake!)!.attachments.values()) {
                if(isImageContentType(attachment.contentType)) {
                    imageAttachments.push(attachment)
                }
            }
        }

        // Add all of the normal attachments to the array
        for(const attachment of msg.attachments.values()) {
            if(isImageContentType(attachment.contentType)) {
                imageAttachments.push(attachment)
            }
        }


        // Reduce the image size to 1 side being a min res
        const MIN_IMAGE_RES = 256

        // Check all of the attachments for images to reverse image search
        for(let i = 0; i < imageAttachments.length; i++) {
            // Download the file -- NOTE: 4mb MAX (as per the fluffle site)

            // Chunked Download method - runs faster with smaller files for some reason????

            // let imgWidth = imageAttachments[i].width
            // let imgHeight = imageAttachments[i].height

            // // Figure out which side is the smallest and set the new image resolution requirements
            // if(imgWidth < imgHeight && imgWidth > MIN_IMAGE_RES){
            //     imgHeight = Math.floor(imgHeight * MIN_IMAGE_RES / imgWidth)
            //     imgWidth = MIN_IMAGE_RES
            // } else 
            // if(imgHeight < imgWidth && imgHeight > MIN_IMAGE_RES) {
            //     imgWidth = Math.floor(imgWidth* MIN_IMAGE_RES / imgHeight)
            //     imgHeight = MIN_IMAGE_RES
            // }
           
            // let imageWebData = await fetch(imageAttachments[i].url).then(res => res.arrayBuffer())

            // const readableStream = await fetch(imageAttachments[i].url).then(res => Readable.fromWeb(res.body))
            // const transformer = sharp()
            // .resize(imgWidth,imgHeight)
            // .png()
            // .on('info', ({ height }) => {
            //     console.log(`Image height is ${height}`)
            // })

            // readableStream.pipe(transformer)

            // let reducedImageData = Buffer.from([])

            // for await (const chunk of readableStream) {
            //     reducedImageData = Buffer.concat([reducedImageData, chunk])
            // }

            // Fetch download method - runs faster with larger files???

            let imageData = await fetch(imageAttachments[i].url).then(res => res.arrayBuffer())

            // Reduce the image size to 1 side being a min res
            const MIN_IMAGE_RES = 256

            let imgWidth = imageAttachments[i].width!
            let imgHeight = imageAttachments[i].height!

            // Figure out which side is the smallest and set the new image resolution requirements
            if(imgWidth < imgHeight && imgWidth > MIN_IMAGE_RES){
                imgHeight = Math.floor(imgHeight * MIN_IMAGE_RES / imgWidth)
                imgWidth = MIN_IMAGE_RES
            } else 
            if(imgHeight < imgWidth && imgHeight > MIN_IMAGE_RES) {
                imgWidth = Math.floor(imgWidth* MIN_IMAGE_RES / imgHeight)
                imgHeight = MIN_IMAGE_RES
            }

            let newImgData = new Blob([await sharp(imageData)
            .resize(imgWidth, imgHeight)
            .png()
            .toBuffer()])

            // Whatever happens to the gif, it is not resized. It just turns into a PNG?

            // Workaround implementation since BunJS doesn't currently support Multipart formdata apparently :skull:
            // https://github.com/oven-sh/bun/issues/7917 -- other solution did not work
            let formData = new FormData()
            formData.append("limit", 8)
            formData.append("includeNsfw", true)
            // // formData.append("platforms", ["e621"])
            formData.append("file", newImgData)

            // Create the encoder to encode the form data
            const formDataEncoder = new FormDataEncoder(formData)

            let searchResults = await fetch("https://api.fluffle.xyz/v1/search", {
                method: "POST",
                headers: new Headers({
                    "User-Agent": "fluffle-discord-bot/1.0 (by Cyanoflame)",
                    ...formDataEncoder.headers
                }),
                body: new Blob(await Readable.from(formDataEncoder.encode()).toArray(), {type: formDataEncoder.contentType})
            }).then(resp => resp.json()) as FluffleResult

            //////////// WORKS IN NODEJS BUT NOT BUNJS FOR SOME REASON //////////////
            // // Query Fluffle
            // let formData = new FormData()
            // formData.append("limit", "8")
            // formData.append("includeNsfw", "true")
            // // formData.append("platforms", ["e621"])
            // formData.append("file", newImgData)

            // let searchResults = await fetch("https://api.fluffle.xyz/v1/search", {
            //     method: "POST",
            //     headers: new Headers({
            //         "User-Agent": "fluffle-discord-bot/1.0 (by Cyanoflame)",
            //     }),
            //     body: formData
            // }).then(resp => resp.json()) as FluffleResult
            /////////////////////////////////////////////////////////////////////////
            
            console.log("SEARCH RESULT:", searchResults)

            // Print results to log
            // console.log(i + ": ", searchResults)

            // Respond to the channel
            if(channel.isTextBased()) {
                if(msg.attachments.size == 1) {
                    outputString += `> # Results:\n${parseResults(searchResults)}`
                } else {
                    outputString += `> # Image ${i+1} Results:\n${parseResults(searchResults)}`
                }
            }
            
            // Update the message
            if(i < msg.attachments.size - 1) {
                responseMsg.edit({
                    content: outputString + "\n" + searchingString,
                    flags: "SuppressEmbeds"
                })
            } else {
                responseMsg.edit({
                    content: outputString,
                    flags: "SuppressEmbeds"
                })
            }
        }

        return
    }
}

export {
    OnImageMsgTrigger
}
