import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core';
import Oas from 'oas';
import APICore from 'api/dist/core';
declare class SDK {
    spec: Oas;
    core: APICore;
    constructor();

    config(config: ConfigOptions): void;

    auth(...values: string[] | number[]): this;

    server(url: string, variables?: {}): void;

    status(metadata: types.StatusMetadataParam): Promise<FetchResponse<200, types.StatusResponse200>>;

    generate_qrcode(metadata: types.GenerateQrcodeMetadataParam): Promise<FetchResponse<200, types.GenerateQrcodeResponse200>>;

    reload(metadata: types.ReloadMetadataParam): Promise<FetchResponse<200, types.ReloadResponse200>>;

    remove_session(metadata: types.RemoveSessionMetadataParam): Promise<FetchResponse<200, types.RemoveSessionResponse200>>;

    get_profile(body: types.GetProfileBodyParam, metadata: types.GetProfileMetadataParam): Promise<FetchResponse<200, types.GetProfileResponse200>>;

    contacts(metadata: types.ContactsMetadataParam): Promise<FetchResponse<200, types.ContactsResponse200>>;

    create_group(body: types.CreateGroupBodyParam, metadata: types.CreateGroupMetadataParam): Promise<FetchResponse<200, types.CreateGroupResponse200>>;

    leave_group(body: types.LeaveGroupBodyParam, metadata: types.LeaveGroupMetadataParam): Promise<FetchResponse<200, types.LeaveGroupResponse200>>;

    chats(metadata: types.ChatsMetadataParam): Promise<FetchResponse<200, types.ChatsResponse200>>;

    send_message(body: types.SendMessageBodyParam, metadata: types.SendMessageMetadataParam): Promise<FetchResponse<201, types.SendMessageResponse201>>;

    send_message_file_from_url(body: types.SendMessageFileFromUrlBodyParam, metadata: types.SendMessageFileFromUrlMetadataParam): Promise<FetchResponse<200, types.SendMessageFileFromUrlResponse200>>;

    send_location(body: types.SendLocationBodyParam, metadata: types.SendLocationMetadataParam): Promise<FetchResponse<200, types.SendLocationResponse200>>;

    send_vcard(body: types.SendVcardBodyParam, metadata: types.SendVcardMetadataParam): Promise<FetchResponse<200, types.SendVcardResponse200>>;

    send_forward_message(body: types.SendForwardMessageBodyParam, metadata: types.SendForwardMessageMetadataParam): Promise<FetchResponse<200, types.SendForwardMessageResponse200>>;

    delete_message(body: types.DeleteMessageBodyParam, metadata: types.DeleteMessageMetadataParam): Promise<FetchResponse<200, types.DeleteMessageResponse200>>;

    get_message_byid(body: types.GetMessageByidBodyParam, metadata: types.GetMessageByidMetadataParam): Promise<FetchResponse<200, types.GetMessageByidResponse200>>;
    get_message_byid(metadata: types.GetMessageByidMetadataParam): Promise<FetchResponse<200, types.GetMessageByidResponse200>>;

    send_button_message(body: types.SendButtonMessageBodyParam, metadata: types.SendButtonMessageMetadataParam): Promise<FetchResponse<200, types.SendButtonMessageResponse200>>;

    send_list_message(body: types.SendListMessageBodyParam, metadata: types.SendListMessageMetadataParam): Promise<FetchResponse<200, types.SendListMessageResponse200>>;
}
declare const createSDK: SDK;
export = createSDK;
