import axios, {AxiosRequestConfig} from "axios";
import {errorLogger, infoLogger} from "./logger";
import {CallDirection, CallEvent} from "@clinq/bridge";
import {normalizePhoneNumber, parsePhoneNumber} from "./phone-numbers";

export async function getAllContacts(apiKey: string, apiUrl: string) {
    let allContacts: Array<object> = []
    infoLogger(apiKey, `Fetching all contacts`);

    const searchContacts = (cursor:string='') => {
        const config: AxiosRequestConfig  = {
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

export async function searchContactByPhonenumber(apiKey: string, apiUrl: string, phoneNumber: string) {
    const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
    const config: AxiosRequestConfig  = {
        headers: {"Accept": `application/json`},
        auth: {username:apiKey.split(':')[0], password: apiKey.split(':')[1]},
    }
    const searchCall = (searchValue: string) => axios.get(apiUrl.replace(/\/$/, '') + `/contacts/search/phonenumber/${searchValue}`,config);
    const originalResponse = searchCall(phoneNumber)
    const mobileNumberE164Response = searchCall(parsedPhoneNumber.e164)
    const mobileNumberE164NormalizedResponse = searchCall(normalizePhoneNumber(parsedPhoneNumber.e164))
    const mobileNumberLocalizedResponse = searchCall(parsedPhoneNumber.localized)
    const mobileNumberNormalizedLocalizedResponse = searchCall(normalizePhoneNumber(parsedPhoneNumber.localized))
    const results = await Promise.all(
        [
            originalResponse,
            mobileNumberE164Response,
            mobileNumberE164NormalizedResponse,
            mobileNumberLocalizedResponse,
            mobileNumberNormalizedLocalizedResponse,
        ].map((promise) => promise.catch(() => ({data: {results: []}})))
    );
    const result = results.filter(ent => ent.data);
    if (!result.length) {
        return;
    }
    infoLogger(apiKey, `Found contact for phone number:`, phoneNumber);
    return result[0].data;
}

export async function createNote(apiKey: string, apiUrl: string, contactId: number, comment: string) {
    const config: AxiosRequestConfig  = {
        headers: {"Accept": `application/json`},
        auth: {username:apiKey.split(':')[0], password: apiKey.split(':')[1]},
    }
    const payload = {"subject": "Phonecall","description": comment,"contact_ids": [contactId.toString()],}
    const commentResponse = await axios.post(apiUrl.replace(/\/$/, '') + `/notes`, payload, config);
    return commentResponse
}

export async function createAgileCRMContact(apiKey: string, apiUrl: string, contact: {}) {
    const config: AxiosRequestConfig  = {
        headers: {"Accept": `application/json`},
        auth: {username:apiKey.split(':')[0], password: apiKey.split(':')[1]},
    }
    const response = await axios.post(apiUrl.replace(/\/$/, '') + `/contacts`, contact,config);
    return response.data;
}
