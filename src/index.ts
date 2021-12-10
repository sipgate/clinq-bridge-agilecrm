import {Adapter, CallDirection, CallEvent, Config, Contact, ServerError, start} from "@clinq/bridge";
import {
    createAgileCRMContact,
    createNote,
    getAllContacts, searchContactByPhonenumber,
} from './utils/agilecrm'
import {
    mapAgileCRMContact2ClinqContact,
    mapClinqContactTemplate2AgileCRMContact,
    mapEvent2Comment
} from "./utils/mapper";
import {errorLogger, infoLogger, warnLogger} from "./utils/logger";
import {ContactTemplate, ContactUpdate} from "@clinq/bridge/dist/models";


class AgileCRMAdapter implements Adapter {

    public async getContacts(config: Config): Promise<Contact[]> {
        infoLogger(config.apiKey, `getContacts triggered`);
        const allContacts = await getAllContacts(config.apiKey, config.apiUrl)
        const clinqContacts: Contact[] = allContacts.map(freshSaleContact => mapAgileCRMContact2ClinqContact(freshSaleContact, config.apiUrl));
        return clinqContacts;
    }

    public async handleCallEvent(config: Config, event: CallEvent): Promise<void> {
        const phoneNumber = event.direction === CallDirection.OUT ? event.to : event.from;
        const searchResponse = await searchContactByPhonenumber(config.apiKey, config.apiUrl, phoneNumber);
        const comment: string = mapEvent2Comment(event);
        if (searchResponse) {
            await createNote(config.apiKey, config.apiUrl, searchResponse.id, comment)
            return
        }
        warnLogger(config.apiKey, `Cannot find contact for phone number:`, phoneNumber);
        return
    }

    public async createContact(config: Config, contact: ContactTemplate): Promise<Contact> {
        try {
            const freshSalesContact = mapClinqContactTemplate2AgileCRMContact(contact);
            const response = await createAgileCRMContact(config.apiKey, config.apiUrl, freshSalesContact)
            const clinqContact = mapAgileCRMContact2ClinqContact(response, config.apiUrl);
            infoLogger(config.apiKey, `Created new contact ${clinqContact.id}`);
            return clinqContact
        } catch (error: any) {
            const responseMessage = error.response?.data?.errors?.message?error.response.data.errors.message:error.message;
            errorLogger(config.apiKey, `Could not create: ${responseMessage}`);
            throw new ServerError(500, "Could not create contact");
        }
    }
}

start(new AgileCRMAdapter());
