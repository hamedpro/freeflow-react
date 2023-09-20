import {
	Dispatch,
	ReactNode,
	SetStateAction,
	createContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	cache,
	core_thing,
	profile,
	profile_seed,
	thing_privileges,
	transaction,
} from "freeflow-core/dist/UnifiedHandler_types";
import {
	calc_cache,
	calc_unresolved_cache,
	create_configured_axios,
	find_active_profile_seed,
	sync_cache,
	sync_profiles_seed,
	user_discoverable_transactions,
	request_new_transaction as utils_request_new_transaction,
	request_new_thing as utils_request_new_thing,
	calc_file_url as utils_calc_file_url,
	find_active_profile,
} from "freeflow-core/dist/utils";
import axios from "axios";
import { io } from "socket.io-client";
import { applyDiff } from "recursive-diff";
import { custom_find_unique } from "hamedpro-helpers";

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
	request_new_transaction: ({
		new_thing_creator,
		diff,
		thing_id,
	}: {
		new_thing_creator?: (current_thing: any) => any;
		diff?: rdiff.rdiffResult[];
		thing_id: number;
	}) => ReturnType<typeof utils_request_new_transaction>;
	request_new_thing: ({
		thing,
		thing_privileges,
	}: {
		thing: core_thing;
		thing_privileges?: thing_privileges;
	}) => ReturnType<typeof utils_request_new_thing>;
	ws_endpoint: string;
	rest_endpoint: string;
	calc_file_url: (file_id: number) => string;
};
var default_context_value: context_value = {
	configured_axios: axios.create(),
	transactions: [],
	cache: [],
	unresolved_cache: [],
	all_transactions: [],
	profiles: [],
	profiles_seed: [],
	set_state: () => {
		throw "context value is still its default value. valid set_state is not set here yet.";
	},
	request_new_transaction: () => {
		throw "context value is still its default value. valid request_new_transaction is not set here yet.";
	},
	request_new_thing: () => {
		throw "context value is still its default value. valid request_new_transaction is not set here yet.";
	},
	ws_endpoint: "http://localhost:5002",
	rest_endpoint: "http://localhost:5001",
	calc_file_url: (file_id: number) => {
		throw "this function has not initialized yet";
	},
};
export const context = createContext<context_value>(default_context_value);
export function FreeFlowReact({
	children,
	ws_endpoint,
	rest_endpoint,
}: {
	children: ReactNode;
	ws_endpoint: string;
	rest_endpoint: string;
}) {
	var [state, set_state] = useState<state_value>(default_context_value);
	//var toast_ref = useRef<Toast>(null);
	var configured_axios = useMemo(() => {
		return create_configured_axios({
			restful_api_endpoint: rest_endpoint,
			jwt: find_active_profile_seed(state.profiles_seed)?.jwt,
		});
	}, [rest_endpoint, JSON.stringify(state.profiles_seed)]);
	var calc_file_url = useMemo(() => {
		return (file_id: number) =>
			utils_calc_file_url(state.profiles_seed, rest_endpoint, file_id);
	}, [rest_endpoint, JSON.stringify(state.profiles_seed)]);
	var transactions = useMemo(
		() => user_discoverable_transactions(state.profiles, state.all_transactions),
		[JSON.stringify(state.profiles), JSON.stringify(state.all_transactions)]
	);
	var cache = useMemo(() => {
		return calc_cache(transactions, undefined);
	}, [JSON.stringify(transactions)]);
	var unresolved_cache = useMemo(() => {
		return calc_unresolved_cache(transactions, undefined);
	}, [JSON.stringify(transactions)]);
	var context_value: context_value = {
		...state,
		configured_axios,
		unresolved_cache,
		cache,
		transactions,
		set_state,
		request_new_transaction: ({
			new_thing_creator,
			diff,
			thing_id,
		}: {
			new_thing_creator?: (current_thing: any) => any;
			diff?: rdiff.rdiffResult[];
			thing_id: number;
		}) =>
			utils_request_new_transaction({
				new_thing_creator,
				diff,
				thing_id,
				unresolved_cache,
				restful_api_endpoint: rest_endpoint,
				jwt: find_active_profile_seed(state.profiles_seed)?.jwt,
			}),
		request_new_thing: ({
			thing,
			thing_privileges,
		}: {
			thing: core_thing;
			thing_privileges?: thing_privileges;
		}) => {
			return utils_request_new_thing({
				unresolved_cache,
				value: thing,
				restful_api_endpoint: rest_endpoint,
				current_profile: find_active_profile(state.profiles),
				thing_privileges,
			});
		},
		ws_endpoint,
		rest_endpoint,
		calc_file_url,
	};
	var websocket = useRef<ReturnType<typeof io>>();
	useLayoutEffect(() => {
		websocket.current = io(ws_endpoint);
		websocket.current.on("sync_profiles", (diff: rdiff.rdiffResult[]) => {
			set_state((prev) => {
				var profiles_clone = [...prev.profiles];
				applyDiff(profiles_clone, diff);
				return {
					...prev,
					profiles: profiles_clone,
				};
			});
		});
		websocket.current.on("sync_all_transactions", (new_transactions: transaction[]) => {
			//console.log(new_transactions.length);
			set_state((prev) => ({
				...prev,
				all_transactions: custom_find_unique(
					prev.all_transactions.concat(new_transactions),
					(tr1: transaction, tr2: transaction) => tr1.id === tr2.id
				),
			}));
		});
		sync_cache(websocket.current, state.all_transactions);
	}, []);
	useEffect(() => {
		if (websocket.current === undefined) {
			throw `internal error! we were sure websocket_client is not undefined,
			but if you see this we were wrong.`;
		}
		sync_profiles_seed(websocket.current, state.profiles_seed);
	}, [JSON.stringify(state.profiles_seed)]);
	useLayoutEffect(() => {
		//localStorage load at first
		if (window.localStorage.getItem("profiles_seed") === null) {
			window.localStorage.setItem(
				"profiles_seed",
				JSON.stringify([{ user_id: 0, is_active: true }])
			);
		}

		var saved_profiles_seed = JSON.parse(
			window.localStorage.getItem("profiles_seed") as string
		);

		set_state((prev) => ({ ...prev, profiles_seed: saved_profiles_seed }));
		set_state((prev) => {
			var clone: state_value = JSON.parse(JSON.stringify(prev));
			if (clone.profiles_seed.some((ps) => ps.is_active === true) === false) {
				clone.profiles_seed.push({ user_id: 0, is_active: true });
			}
			return clone;
		});
	}, []);
	useEffect(() => {
		localStorage.setItem("profiles_seed", JSON.stringify(state.profiles_seed));
	}, [JSON.stringify(state.profiles_seed)]);
	return (
		<context.Provider value={context_value}>
			{/* <Toast ref={toast_ref} /> */}
			{children}
		</context.Provider>
	);
}
