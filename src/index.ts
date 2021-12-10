import {Adapter, CallDirection, CallEvent, Config, Contact, ServerError, start} from "@clinq/bridge";
import {
    createAgileCRMContact,
    createNote, deleteAgileCRMContact,
    getAllContacts, searchContactByPhonenumber, updateAgileCRMContact,
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
        const clinqContacts: Contact[] = allContacts.map(agileCRMContact => mapAgileCRMContact2ClinqContact(agileCRMContact, config.apiUrl));
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
            const agileCRMContact = mapClinqContactTemplate2AgileCRMContact(contact);
            const response = await createAgileCRMContact(config.apiKey, config.apiUrl, agileCRMContact)
            const clinqContact = mapAgileCRMContact2ClinqContact(response, config.apiUrl);
            infoLogger(config.apiKey, `Created new contact ${clinqContact.id}`);
            return clinqContact
        } catch (error: any) {
            const responseMessage = error.response?.data?.errors?.message?error.response.data.errors.message:error.message;
            errorLogger(config.apiKey, `Could not create: ${responseMessage}`);
            throw new ServerError(500, "Could not create contact");
        }
    }

    public async updateContact(config: Config, id: string, contact: ContactUpdate): Promise<Contact>{
        try {
            const agileCRMContact = mapClinqContactTemplate2AgileCRMContact(contact, id);
            const response = await updateAgileCRMContact(config.apiKey, config.apiUrl, agileCRMContact)
            infoLogger(config.apiKey, `Updated contact ${id}`);
            return mapAgileCRMContact2ClinqContact(response, config.apiUrl);
        } catch (error: any) {
            const responseMessage = error.response?.data?.errors?.message?error.response.data.errors.message:error.message;
            errorLogger(config.apiKey, `Could not update contact with id ${id} : ${responseMessage}`);
            throw new ServerError(500, "Could not update contact");
        }
    }

    public async deleteContact(config: Config, id: string): Promise<void>{
        try {
            const response = await deleteAgileCRMContact(config.apiKey, config.apiUrl, id)
            infoLogger(config.apiKey, `Deleted contact ${id}`);
        } catch (error: any) {
            const responseMessage = error.response?.data?.errors?.message?error.response.data.errors.message:error.message;
            errorLogger(config.apiKey, `Could not delete contact with id ${id}: ${responseMessage}`);
            throw new ServerError(500, "Could not delete contact");
        }
    }
}

start(new AgileCRMAdapter());
