import {CallDirection, CallEvent, Contact, PhoneNumber, PhoneNumberLabel} from "@clinq/bridge";
import * as moment from "moment";
import {sanitizePhonenumber} from "./phone-numbers";
import {ContactTemplate, ContactUpdate} from "@clinq/bridge/dist/models";
const { v4: uuidv4 } = require('uuid');

export const mapAgileCRMContact2ClinqContact = (agileCRMContact: any, apiUrl: string) => {
    const phoneNumbers: PhoneNumber[] = [];
    const agileCRMPhonenumbersMobile = agileCRMContact.properties.filter((ent: any)=>ent.name==='phone' && ent.subtype==='mobile')
    const agileCRMPhonenumbersWork = agileCRMContact.properties.filter((ent: any)=>ent.name==='phone' && ent.subtype==='work')
    const agileCRMPhonenumbersHome = agileCRMContact.properties.filter((ent: any)=>ent.name==='phone' && ent.subtype==='home')
    const agileCRMPhonenumbersOthers = agileCRMContact.properties.filter((ent: any)=>ent.name==='phone' && ent.subtype!=='home'
        && ent.subtype!=='work'&& ent.subtype!=='mobile')
    // agilecrm work number -> clinq work number
    if (agileCRMPhonenumbersMobile.length) {
        phoneNumbers.push({
            label: PhoneNumberLabel.MOBILE,
            phoneNumber: sanitizePhonenumber(agileCRMPhonenumbersMobile[0].value),
        });
    } else if (agileCRMPhonenumbersOthers.length) {
        // if no number is defined as mobile in AgileCRM => check if one of the undefined is an mobile number with google lib
        phoneNumbers.push({
            label: PhoneNumberLabel.MOBILE,
            phoneNumber: sanitizePhonenumber(agileCRMPhonenumbersOthers.pop().value),
        });
    }
    if (agileCRMPhonenumbersWork.length) {
        phoneNumbers.push({
            label: PhoneNumberLabel.WORK,
            phoneNumber: sanitizePhonenumber(agileCRMPhonenumbersWork[0].value),
        });
    } else if (agileCRMPhonenumbersOthers.length) {
        // if no number is defined as WORK in AgileCRM => check if one of the undefined is an mobile number with google lib
        phoneNumbers.push({
            label: PhoneNumberLabel.WORK,
            phoneNumber: sanitizePhonenumber(agileCRMPhonenumbersOthers.pop().value),
        });
    }
    if (agileCRMPhonenumbersHome.length) {
        phoneNumbers.push({
            label: PhoneNumberLabel.HOME,
            phoneNumber: sanitizePhonenumber(agileCRMPhonenumbersHome[0].value),
        });
    } else if (agileCRMPhonenumbersOthers.length) {
        // if no number is defined as HOME in AgileCRM => check if one of the undefined is an mobile number with google lib
        phoneNumbers.push({
            label: PhoneNumberLabel.HOME,
            phoneNumber: sanitizePhonenumber(agileCRMPhonenumbersOthers.pop().value),
        });
    }
    const contactUrl = (new URL(apiUrl)).origin + '/#contact/' + agileCRMContact.id.toString();
    const companyProperty = agileCRMContact.properties.filter((ent: any)=>ent.name==='company');
    const emailProperty = agileCRMContact.properties.filter((ent:any)=>ent.name==='email');
    const firstNameProperty = agileCRMContact.properties.filter((ent:any)=>ent.name==='first_name');
    const lastNameProperty = agileCRMContact.properties.filter((ent:any)=>ent.name==='last_name');
    const name = (firstNameProperty.length? firstNameProperty[0].value: '') + ' ' + (lastNameProperty.length? lastNameProperty[0].value: '');
    const imageProperty = agileCRMContact.properties.filter((ent:any)=>ent.name==='image');
    const contact: Contact = {
        id: agileCRMContact.id.toString(),
        email: emailProperty.length? emailProperty[0].value: null,
        name: name?name:null,
        firstName: firstNameProperty.length? firstNameProperty[0].value: null,
        lastName: lastNameProperty.length? lastNameProperty[0].value: null,
        organization: companyProperty.length ? companyProperty[0].value : null,
        contactUrl: contactUrl,
        avatarUrl: imageProperty.length?imageProperty[0].value:null,
        phoneNumbers,
    };
    return contact;
};
