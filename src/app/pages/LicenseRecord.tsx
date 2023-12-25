import { useHistory, useLocation } from "react-router";
import {
    IonActionSheet, IonAlert, IonBackButton, IonButton, IonButtons, IonCol,
    IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem,
    IonLabel, IonPage, IonRow, IonTitle, IonToolbar
} from '@ionic/react';
import { useEffect, useState } from "react";
import { License, NEW_RECORD, emptyLicense } from "../interfaces/Interfaces";
import { arrowUndo, camera, checkmark, document, ellipsisVertical, image, close } from "ionicons/icons";
import { FilePicker } from "@capawesome/capacitor-file-picker";
import { Toast } from "@capacitor/toast";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { DBModel } from "../modules/db/DBModel";
import { getTimestamp } from "../modules/helpers/Helpers";
import { FileOpener } from "@capawesome-team/capacitor-file-opener";
import { Directory, Filesystem } from "@capacitor/filesystem";

const LicenseRecord: React.FC = () => {

    const history = useHistory();
    const location = useLocation();

    const [title, setTitle] = useState('License');
    const [license, setLicense] = useState<License>(emptyLicense());
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    useEffect(() => {
        const state = location.state as { lic: License };
        if (state !== undefined) {
            setLicense(state.lic);
            setTitle(state.lic.name);
        }
    }, [location.state])

    const saveLicense = async () => {
        const db = new DBModel();
        await db.initDBConnection();

        if (license.name === '') {
            Toast.show({ text: 'Name is required' });
            return;
        }

        if (license.category === '') {
            Toast.show({ text: 'Category is required' });
            return;
        }

        license.update_time = getTimestamp();

        if (license.uuid === NEW_RECORD) {
            const result = await db.insertLicense(license);
            if (result instanceof Error) {
                Toast.show({ text: result.message });
                return;
            }
        } else {
            const result = await db.updateLicense(license);
            if (result instanceof Error) {
                Toast.show({ text: result.message });
            }
        }

        Toast.show({ text: 'License saved' });
    }

    const deleteLicense = async () => {
        const db = new DBModel();
        await db.initDBConnection();

        const result = await db.deleteLicense(license.uuid);
        if (result instanceof Error) {
            Toast.show({ text: result.message });
        } else {
            Toast.show({ text: 'License deleted' });
            history.goBack();
        }
    }

    const addFileAttachment = async (): Promise<void> => {
        try {
            const result = await FilePicker.pickFiles({ multiple: false, readData: true });
            const file = result.files[0];

            setLicense({ ...license, document_name: file.name, document: file.data! });
        } catch (err: any) {
            if (err.message !== 'pickFiles canceled.') {
                Toast.show({ text: `Cannot attach file ${err.message}` });
            }
        }
    }

    const addImageAttachment = async (): Promise<void> => {
        try {
            const result = await FilePicker.pickImages({ multiple: false, readData: true });
            const file = result.files[0];

            setLicense({ ...license, document_name: file.name, document: file.data! });
        } catch (err: any) {
            if (err.message !== 'pickFiles canceled.') {
                Toast.show({ text: `Cannot attach file ${err.message}` });
            }
        }
    }

    const addPhotoAttachment = async (): Promise<void> => {
        try {
            const image = await Camera.getPhoto({
                resultType: CameraResultType.Base64,
                quality: 100,
                source: CameraSource.Camera,
            });

            const filename = license.name && license.name || 'license';
            setLicense({ ...license, document_name: `${filename}.${image.format}`, document: image.base64String! });
        } catch (err: any) {
            Toast.show({ text: `Cannot attach photo ${err.message}` });
        }
    }

    const openAttachment = async (): Promise<void> => {
        Toast.show({ text: `Opening attachment...` });

        try {
            const file = await Filesystem.writeFile({
                path: license.document_name,
                data: license.document,
                directory: Directory.Documents,
            });

            await FileOpener.openFile({ path: file.uri });
        } catch (err: any) {
            Toast.show({ text: `Cannot open attachment ${err.message}` });
        }
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>

                    <IonButtons slot="start">
                        <IonBackButton defaultHref="#"></IonBackButton>
                    </IonButtons>
                    <IonButtons slot="secondary">
                        <IonButton onClick={saveLicense}>
                            <IonIcon slot="icon-only" icon={checkmark}></IonIcon>
                        </IonButton>

                        <IonButton id="license-record-action-sheet">
                            <IonIcon slot="icon-only" icon={ellipsisVertical}></IonIcon>
                        </IonButton>

                        <IonActionSheet
                            trigger="license-record-action-sheet"
                            header="License Actions"
                            buttons={[
                                { text: 'Save', icon: checkmark, role: 'selected', handler: saveLicense },
                                { text: 'Attach File', icon: document, handler: addFileAttachment },
                                { text: 'Attach Image', icon: image, handler: addImageAttachment },
                                { text: 'Take Photo', icon: camera, handler: addPhotoAttachment },
                                { text: 'Delete attachment', icon: close, handler: () => { setLicense({ ...license, document_name: '', document: '' }) } },
                                { text: 'Delete', icon: close, role: 'destructive', handler: () => { setShowConfirmDelete(true); } },
                                { text: 'Cancel', icon: arrowUndo, role: 'cancel', },
                            ]}
                        ></IonActionSheet>

                        <IonAlert header="Delete license?"
                            message="Are you sure you want to delete this license?"
                            isOpen={showConfirmDelete}
                            onDidDismiss={() => setShowConfirmDelete(false)}
                            buttons={[
                                { text: 'Confirm', role: 'confirm', handler: deleteLicense },
                                { text: 'Cancel', role: 'cancel' },
                            ]}>
                        </IonAlert>

                    </IonButtons>
                    <IonTitle>{title}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonGrid>

                    <IonRow>
                        <IonCol>
                            <IonItem>
                                <IonInput label="Category" labelPlacement="stacked" placeholder="Category" value={license.category}
                                    onIonInput={(e: any) => { setLicense({ ...license, category: e.target.value }) }}>
                                </IonInput>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem>
                                <IonInput label="Name" labelPlacement="stacked" placeholder="Name" value={license.name}
                                    onIonInput={(e: any) => { setLicense({ ...license, name: e.target.value }) }}>
                                </IonInput>
                            </IonItem>
                        </IonCol>
                    </IonRow>


                    <IonRow>
                        <IonCol>
                            <IonItem>
                                <IonInput label="Number" labelPlacement="stacked" placeholder="Number" value={license.number}
                                    onIonInput={(e: any) => { setLicense({ ...license, number: e.target.value }) }}>
                                </IonInput>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem>
                                <IonInput label="Issued" labelPlacement="stacked" placeholder="DD/MM/YYYY" value={license.issued}
                                    onIonInput={(e: any) => { setLicense({ ...license, issued: e.target.value }) }}>
                                </IonInput>
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    <IonRow>
                        <IonCol>
                            <IonItem>
                                <IonInput label="Valid From" labelPlacement="stacked" placeholder="DD/MM/YYYY" value={license.valid_from}
                                    onIonInput={(e: any) => { setLicense({ ...license, valid_from: e.target.value }) }}>
                                </IonInput>
                            </IonItem>
                        </IonCol>
                        <IonCol>
                            <IonItem>
                                <IonInput label="Valid Until" labelPlacement="stacked" placeholder="DD/MM/YYYY" value={license.valid_until}
                                    onIonInput={(e: any) => { setLicense({ ...license, valid_until: e.target.value }) }}>
                                </IonInput>
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    <IonRow>
                        <IonCol>
                            {(license.document_name) &&
                                <>
                                    <IonItem onClick={openAttachment}>
                                        {(license.document_name.endsWith('.jpg') ||
                                            license.document_name.endsWith('.jpeg') ||
                                            license.document_name.endsWith('.png')) &&
                                            <IonIcon slot="start" icon={image}></IonIcon> ||
                                            <IonIcon slot="start" icon={document}></IonIcon>
                                        }
                                        <IonInput value={license.document_name} readonly></IonInput>
                                    </IonItem>
                                </>
                                ||
                                <>
                                    <IonItem>
                                        <IonLabel class='ion-text-center'>No attachment</IonLabel>
                                    </IonItem>
                                </>
                            }
                        </IonCol>
                    </IonRow>

                </IonGrid>
            </IonContent>
        </IonPage >
    );

};
export default LicenseRecord;