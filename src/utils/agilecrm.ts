import axios, {AxiosRequestConfig} from "axios";
import {errorLogger, infoLogger} from "./logger";
import {CallDirection, CallEvent} from "@clinq/bridge";
import {normalizePhoneNumber, parsePhoneNumber} from "./phone-numbers";

export async function getAllContacts(apiKey: string, apiUrl: string) {
    let allContacts: Array<object> = []
    infoLogger(apiKey, `Fetching all contacts`);

    const searchContacts = (cursor:string='') => {
        var config: AxiosRequestConfig  = {
            headers: {"Accept": `application/json`},
            auth: {username:apiKey.split(':')[0], password: apiKey.split(':')[1]},
        }
        if (cursor) {
            config.params = {'cursor': cursor}
        }
        return axios.get(apiUrl.replace(/\/$/, '') + `/contacts/`,config);
    }
    let allContactsResponse = await searchContacts();
    allContacts = allContacts.concat(allContactsResponse.data)
    infoLogger(apiKey, `Fetched contacts batch of size ${allContactsResponse.data.length}`);
    while (allContactsResponse.data.at(-1).cursor) {
        allContactsResponse = await searchContacts(allContactsResponse.data.at(-1).cursor);
        allContacts = allContacts.concat(allContactsResponse.data)
        infoLogger(apiKey, `Fetched contacts batch of size ${allContactsResponse.data.length}`);
    }
    infoLogger(apiKey, `Fetched ${allContacts.length} contacts`);
    return allContacts
}
