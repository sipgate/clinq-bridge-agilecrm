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

export const mapEvent2Comment = (
    callEvent: CallEvent,
): string => {
    const { direction, from, to, channel } = callEvent;
    const phoneNumber = callEvent.direction === CallDirection.OUT ? callEvent.to : callEvent.from;
    const date = moment(Number(callEvent.start));
    const duration = formatDuration(callEvent.end - callEvent.start);
    const directionInfo = direction === CallDirection.IN ? "Eingehender" : "Ausgehender";
    const prePosition = direction === CallDirection.IN ? "von" : "an";
    return `${directionInfo} CLINQ Anruf in channel ${channel.name} ${prePosition} Nummer ${phoneNumber} am ${date.format("DD.MM.YYYY")} (${duration})`;
};

function formatDuration(ms: number): string {
    const duration = moment.duration(ms);
    const minutes = Math.floor(duration.asMinutes());
    const seconds = duration.seconds() < 10 ? `0${duration.seconds()}` : duration.seconds();
    return `${minutes}:${seconds} min`;
}

export const mapClinqContactTemplate2AgileCRMContact = (
    contactTemplate: ContactTemplate,
    id:string=""
): {} => {
    const agileCrmContact = []
    contactTemplate.phoneNumbers?.forEach(function(phoneNumber:PhoneNumber) {
        if (phoneNumber.label === PhoneNumberLabel.MOBILE) {
            agileCrmContact.push({"type": "SYSTEM", "value": phoneNumber.phoneNumber, "name": "phone", "subtype":"mobile"})
        }
        if (phoneNumber.label === PhoneNumberLabel.WORK) {
            agileCrmContact.push({"type": "SYSTEM", "value": phoneNumber.phoneNumber, "name": "phone", "subtype":"work"})
        }
        if (phoneNumber.label === PhoneNumberLabel.HOME) {
            agileCrmContact.push({"type": "SYSTEM", "value": phoneNumber.phoneNumber, "name": "phone", "subtype":"home"})
        }
    })
    if (contactTemplate.email){
        agileCrmContact.push({"type": "SYSTEM", "value": contactTemplate.email, "name":"email"})
    }
    else {
        agileCrmContact.push({"type": "SYSTEM", "value": "", "name":"email"})
    }
    if (contactTemplate.firstName){
        agileCrmContact.push({"type": "SYSTEM", "value": contactTemplate.firstName, "name":"first_name"})
    }
    else {
        agileCrmContact.push({"type": "SYSTEM", "value": "", "name":"first_name"})
    }
    if (contactTemplate.lastName){
        agileCrmContact.push({"type": "SYSTEM", "value": contactTemplate.lastName, "name":"last_name"})
    }
    else {
        agileCrmContact.push({"type": "SYSTEM", "value": "", "name":"last_name"})
    }
    if (contactTemplate.organization){
        agileCrmContact.push({"type": "SYSTEM", "value": contactTemplate.organization, "name":"company"})
    }
    else {
        agileCrmContact.push({"type": "SYSTEM", "value": "", "name":"company"})
    }
    if (id)
        return {'id':id, 'properties': agileCrmContact};
    else
        return {'properties': agileCrmContact};
};


