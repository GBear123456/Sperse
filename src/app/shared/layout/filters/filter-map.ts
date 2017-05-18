export class FilterMap {
    static sections: Object = {
		app: {
			admin: {
				clients: [
					{cnt: 'status'},
					{cnt: 'employee'}, 
					{cnt: 'date', cpt: 'LeadDate', fld: 'lead_date'},
					{cnt: 'partner'},
				]
			}
		}
	}

	static resolve(path: String): any {
		let lookup = FilterMap.sections;
		path.split('/').forEach(function(part){
			if (part && lookup)
				lookup = lookup[part];
		});
		return lookup;
	}
}
