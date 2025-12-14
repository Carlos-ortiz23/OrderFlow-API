import { ClientService } from "./application/clientService";

const clientService = new ClientService();

export class ClientModule {
    static get clientService(): ClientService {
        return clientService;
    }
}
