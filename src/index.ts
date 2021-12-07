import {Adapter, CallDirection, CallEvent, Config, Contact, ServerError, start} from "@clinq/bridge";
import {
    getAllContacts,
} from './utils/agilecrm'
import {
    mapAgileCRMContact2ClinqContact
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
}

start(new AgileCRMAdapter());
