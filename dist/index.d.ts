import { Dispatch, ReactNode, SetStateAction } from "react";
import { cache, core_thing, profile, profile_seed, thing_privileges, transaction } from "freeflow-core/dist/UnifiedHandler_types";
import { create_configured_axios, request_new_transaction as utils_request_new_transaction, request_new_thing as utils_request_new_thing } from "freeflow-core/dist/utils";
export type state_value = {
    all_transactions: transaction[];
    profiles_seed: profile_seed[];
    profiles: profile[];
};
export type context_value = state_value & {
    configured_axios: ReturnType<typeof create_configured_axios>;
    transactions: transaction[];
    cache: cache;
    unresolved_cache: cache;
    set_state: Dispatch<SetStateAction<state_value>>;
    request_new_transaction: ({ new_thing_creator, diff, thing_id, }: {
        new_thing_creator?: (current_thing: any) => any;
        diff?: rdiff.rdiffResult[];
        thing_id: number;
    }) => ReturnType<typeof utils_request_new_transaction>;
    request_new_thing: ({ thing, thing_privileges, }: {
        thing: core_thing;
        thing_privileges?: thing_privileges;
    }) => ReturnType<typeof utils_request_new_thing>;
    ws_endpoint: string;
    rest_endpoint: string;
    calc_file_url: (file_id: number) => string;
    download_a_file: (file_id: number) => void;
    download_tar_archive: (file_ids: number[], filename: string) => void;
};
export declare const context: import("react").Context<context_value>;
export declare function FreeFlowReact({ children, ws_endpoint, rest_endpoint, }: {
    children: ReactNode;
    ws_endpoint: string;
    rest_endpoint: string;
}): import("react/jsx-runtime").JSX.Element;
