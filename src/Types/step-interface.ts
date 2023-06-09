export interface Step {
	message: string;
	property: string;
	options?: { text: string; callback_data: string }[];
  }
  