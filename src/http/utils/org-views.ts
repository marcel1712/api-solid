import { Org } from "@prisma/client";

/** What anyone may see about an org: the profile shown next to its pets. */
export function toPublicOrg(org: Org) {
  return {
    id: org.id,
    name: org.name,
    whatsapp: org.whatsapp,
    city: org.city,
    address: org.address,
    created_at: org.created_at,
  };
}

/**
 * What an org sees about itself. The CNPJ check stays out: it's the
 * reviewer's working note, not a verdict to argue with.
 */
export function toOwnOrg(org: Org) {
  const {
    password_hash: _password_hash,
    cnpjCheck: _cnpjCheck,
    ...own
  } = org;
  return own;
}
